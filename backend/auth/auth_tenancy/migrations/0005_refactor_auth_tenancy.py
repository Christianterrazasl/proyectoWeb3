from django.db import migrations, models
import django.utils.timezone

import auth_tenancy.infrastructure.persistence.models.user_model


class Migration(migrations.Migration):

    dependencies = [
        ("auth_tenancy", "0004_usercompanymodel"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="companymodel",
            options={"ordering": ("id",)},
        ),
        migrations.AlterModelOptions(
            name="usermodel",
            options={"ordering": ("id",)},
        ),
        migrations.AlterModelManagers(
            name="usermodel",
            managers=[("objects", auth_tenancy.infrastructure.persistence.models.user_model.UserManager())],
        ),
        migrations.RenameField(
            model_name="usermodel",
            old_name="role",
            new_name="global_role",
        ),
        migrations.AddField(
            model_name="usermodel",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now, auto_now_add=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="usermodel",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="usermodel",
            name="is_staff",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="usermodel",
            name="last_login",
            field=models.DateTimeField(blank=True, null=True, verbose_name="last login"),
        ),
        migrations.AddField(
            model_name="usermodel",
            name="updated_at",
            field=models.DateTimeField(default=django.utils.timezone.now, auto_now=True),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="companymodel",
            name="status",
            field=models.CharField(
                choices=[("PENDING", "PENDING"), ("APPROVED", "APPROVED"), ("REJECTED", "REJECTED")],
                default="PENDING",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="usermodel",
            name="global_role",
            field=models.CharField(
                choices=[("admin", "admin"), ("provider", "provider"), ("user", "user")],
                default="user",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="usermodel",
            name="password",
            field=models.CharField(max_length=128, verbose_name="password"),
        ),
        migrations.RenameModel(
            old_name="UserCompanyModel",
            new_name="MembershipModel",
        ),
        migrations.AlterModelOptions(
            name="membershipmodel",
            options={"ordering": ("id",)},
        ),
        migrations.RenameField(
            model_name="membershipmodel",
            old_name="role",
            new_name="company_role",
        ),
        migrations.AddField(
            model_name="membershipmodel",
            name="updated_at",
            field=models.DateTimeField(default=django.utils.timezone.now, auto_now=True),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="membershipmodel",
            name="company",
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name="memberships",
                to="auth_tenancy.companymodel",
            ),
        ),
        migrations.AlterField(
            model_name="membershipmodel",
            name="company_role",
            field=models.CharField(
                choices=[("provider", "provider"), ("manager", "manager"), ("operator", "operator")],
                default="provider",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="membershipmodel",
            name="user",
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name="memberships",
                to="auth_tenancy.usermodel",
            ),
        ),
    ]
