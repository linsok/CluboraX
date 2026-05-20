FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBIAN_FRONTEND=noninteractive
ENV DJANGO_SETTINGS_MODULE=campus_management.settings

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        pkg-config \
        python3-dev \
        gcc \
        default-libmysqlclient-dev \
        libmagic1 \
        libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN python - <<'PY'
from pathlib import Path

requirements = Path('/app/requirements.txt').read_text().splitlines()
filtered = [line for line in requirements if line.strip() != 'torch>=2.0.0']
Path('/tmp/requirements-docker.txt').write_text('\n'.join(filtered) + '\n')
PY

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --retries 5 --timeout 120 torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir --retries 5 --timeout 120 -r /tmp/requirements-docker.txt

# Copy project
COPY . /app/

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Create static/media directories
RUN mkdir -p /app/staticfiles /app/mediafiles

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python manage.py check --deploy

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "campus_management.wsgi:application"]
