# Generated by Django 4.1.4 on 2023-05-16 00:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend_api', '0002_alter_queueuser_options_alter_queueuser_position'),
    ]

    operations = [
        migrations.AddField(
            model_name='queue',
            name='creator_id',
            field=models.PositiveIntegerField(default=1),
        ),
    ]