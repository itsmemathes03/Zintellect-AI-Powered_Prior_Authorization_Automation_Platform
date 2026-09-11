import os
from jinja2 import Environment, FileSystemLoader

_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

_env = Environment(
    loader=FileSystemLoader(_TEMPLATE_DIR),
    autoescape=True,
)


def render_template(template_name: str, context: dict) -> str:
    template = _env.get_template(template_name)
    return template.render(**context)
