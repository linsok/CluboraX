#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# For Python 3.13 compatibility with MySQL, use PyMySQL as MySQLdb
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# Add Django path
#ys.path.insert(0, r'D:\nextocr-khmer-test\venv\Lib\site-packages')
# Add mssql backend path
#sys.path.insert(0, r'D:\nextocr-khmer-test\venv\Lib\site-packages\django_mssql_backend')

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_management.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
