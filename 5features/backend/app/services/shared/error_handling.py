"""
Error handling utilities
"""
from functools import wraps
from typing import Callable, Any
import logging
from fastapi import HTTPException
from shared.logging_config import setup_logger

logger = setup_logger(__name__)

def handle_exceptions(func: Callable) -> Callable:
    """
    A decorator that wraps a function to catch exceptions and log them,
    then either re-raise or return a default value.
    For async functions, use `handle_async_exceptions`.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Exception in {func.__name__}: {e}")
            raise  # Re-raise the exception after logging
    return wrapper

def handle_async_exceptions(func: Callable) -> Callable:
    """
    A decorator that wraps an async function to catch exceptions and log them.
    """
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Exception in {func.__name__}: {e}")
            raise
    return async_wrapper

# Example usage:
# @handle_exceptions
# def my_function():
#     ...
#
# @handle_async_exceptions
# async def my_async_function():
#     ...