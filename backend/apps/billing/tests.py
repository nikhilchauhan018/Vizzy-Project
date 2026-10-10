"""
Tests for Billing App, Credit Balance, and CreditLedger service.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.billing.models import CreditBalance, CreditTransaction
from apps.billing.services.credit_ledger import CreditLedger, InsufficientCreditsError

User = get_user_model()


class CreditLedgerUnitTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='credit_user@vizzy.local',
            password='securepassword123',
        )

    def test_default_balance_provisioning(self):
        balance = CreditLedger.get_balance(self.user)
        self.assertEqual(balance, 100)

    def test_has_sufficient_credits(self):
        self.assertTrue(CreditLedger.has_sufficient_credits(self.user, 10))
        self.assertTrue(CreditLedger.has_sufficient_credits(self.user, 100))
        self.assertFalse(CreditLedger.has_sufficient_credits(self.user, 101))

    def test_deduct_credits_creates_transaction_and_decreases_balance(self):
        tx = CreditLedger.deduct(self.user, amount=10, description='Panel 1 generation')
        self.assertEqual(tx.amount, 10)
        self.assertEqual(tx.transaction_type, CreditTransaction.TransactionType.DEDUCTION)
        self.assertEqual(CreditLedger.get_balance(self.user), 90)

    def test_insufficient_credits_raises_error_and_preserves_balance(self):
        # Deplete balance
        CreditLedger.deduct(self.user, amount=100)
        self.assertEqual(CreditLedger.get_balance(self.user), 0)

        with self.assertRaises(InsufficientCreditsError):
            CreditLedger.deduct(self.user, amount=10)

        self.assertEqual(CreditLedger.get_balance(self.user), 0)

    def test_refund_credits_restores_balance_and_creates_transaction(self):
        CreditLedger.deduct(self.user, amount=10, description='Job test')
        self.assertEqual(CreditLedger.get_balance(self.user), 90)

        refund_tx = CreditLedger.refund(self.user, amount=10, description='Refund job test')
        self.assertEqual(refund_tx.amount, 10)
        self.assertEqual(refund_tx.transaction_type, CreditTransaction.TransactionType.REFUND)
        self.assertEqual(CreditLedger.get_balance(self.user), 100)
