import uuid
from django.db import models
from django.conf import settings

class CreditBalance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credit_balance')
    balance = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Credits for {self.user}: {self.balance}"

class CreditTransaction(models.Model):
    class TransactionType(models.TextChoices):
        DEDUCTION = 'DEDUCTION', 'Deduction'
        REFUND = 'REFUND', 'Refund'
        PURCHASE = 'PURCHASE', 'Purchase'
        BONUS = 'BONUS', 'Bonus'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_balance = models.ForeignKey(CreditBalance, on_delete=models.CASCADE, related_name='transactions')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    description = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} ({self.amount}) on {self.credit_balance_id}"
