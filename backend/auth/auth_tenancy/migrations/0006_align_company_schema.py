from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenancy", "0005_refactor_auth_tenancy"),
    ]

    operations = [
        migrations.AlterModelTable(
            name="companymodel",
            table="auth_company",
        ),
        migrations.AddField(
            model_name="companymodel",
            name="slug",
            field=models.SlugField(max_length=150, unique=True, blank=True, null=True),
        ),
        migrations.AddField(
            model_name="companymodel",
            name="category",
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name="companymodel",
            name="short_description",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="companymodel",
            name="is_public",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="companymodel",
            name="logo_url",
            field=models.URLField(max_length=500, blank=True, null=True),
        ),
    ]