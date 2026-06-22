from django.db import migrations, models


class Migration(migrations.Migration):
    """Add `debt_id` to the transactional write model.

    The field starts nullable so pre-Slice-1 rows remain readable while new QR
    intents move to the exact-debt contract.
    """

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="transactionmodel",
            name="debt_id",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
