"""
Logging configuration
"""
import logging
import sys
from typing import Any, Dict

def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Set up a logger with a standard format and output to stdout.

    Args:
        name: The name of the logger (usually __name__)
        level: The logging level (default: INFO)

    Returns:
        A configured logger instance
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        # Logger already configured, return it
        return logger

    logger.setLevel(level)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

# Example usage in a module:
# logger = setup_logger(__name__)