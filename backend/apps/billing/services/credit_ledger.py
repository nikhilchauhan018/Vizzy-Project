"""
Credit Ledger Service for Vizzy.
Handles atomic deduction and refund of generation credits.
Follows DATABASE_SCHEMA.md exactly.
"""

import logging
from typing import Optional
from django.db import transaction
from django.core.exceptions import ValidationError

from apps.billing.models import CreditBalance, CreditTransaction

logger = logging.getLogger(__name__)

GENERATION_CREDIT_COST = 10


class InsufficientCreditsError(ValidationError):
    """Raised when a user attempts an action requiring more credits than their current balance."""
    pass


class CreditLedger:
    """
    Thread-safe, atomic ledger for user credit balance deductions and refunds.
    """

    @classmethod
    def get_or_create_balance(cls, user) -> CreditBalance:
        """Retrieves or provisions the initial CreditBalance (default 100) for a user."""
        balance_obj, _ = CreditBalance.objects.get_or_create(
            user=user,
            defaults={'balance': 100},
        )
        return balance_obj

    @classmethod
    def get_balance(cls, user) -> int:
        """Returns the current credit balance of the user."""
        return cls.get_or_create_balance(user).balance

    @classmethod
    def has_sufficient_credits(cls, user, required_credits: int = GENERATION_CREDIT_COST) -> bool:
        """Checks whether the user has at least the required credit balance."""
        return cls.get_balance(user) >= required_credits

    @classmethod
    def deduct(
        cls,
        user,
        amount: int = GENERATION_CREDIT_COST,
        description: str = 'Generation job credit deduction',
    ) -> CreditTransaction:
        """
        Atomically deducts credits from the user balance.
        Raises InsufficientCreditsError if balance is insufficient.
        """
        if amount <= 0:
            raise ValueError("Deduction amount must be strictly positive.")

        with transaction.atomic():
            cls.get_or_create_balance(user)
            credit_balance = CreditBalance.objects.select_for_update().get(user=user)

            if credit_balance.balance < amount:
                raise InsufficientCreditsError(
                    f"Insufficient credits. Required: {amount}, available: {credit_balance.balance}."
                )

            credit_balance.balance -= amount
            credit_balance.save(update_fields=['balance', 'updated_at'])

            tx = CreditTransaction.objects.create(
                credit_balance=credit_balance,
                amount=amount,
                transaction_type=CreditTransaction.TransactionType.DEDUCTION,
                description=description,
            )
            logger.info(f"Deducted {amount} credits for user {user.id}. New balance: {credit_balance.balance}")
            return tx

    @classmethod
    def refund(
        cls,
        user,
        amount: int = GENERATION_CREDIT_COST,
        description: str = 'Refund for failed generation job',
    ) -> CreditTransaction:
        """
        Atomically refunds credits to the user balance.
        """
        if amount <= 0:
            raise ValueError("Refund amount must be strictly positive.")

        with transaction.atomic():
            cls.get_or_create_balance(user)
            credit_balance = CreditBalance.objects.select_for_update().get(user=user)

            credit_balance.balance += amount
            credit_balance.save(update_fields=['balance', 'updated_at'])

            tx = CreditTransaction.objects.create(
                credit_balance=credit_balance,
                amount=amount,
                transaction_type=CreditTransaction.TransactionType.REFUND,
                description=description,
            )
            logger.info(f"Refunded {amount} credits for user {user.id}. New balance: {credit_balance.balance}")
            return tx
