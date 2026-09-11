import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

_template_dir = os.path.join(os.path.dirname(__file__), "templates")
_jinja_env = Environment(
    loader=FileSystemLoader(_template_dir),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)


def render_template(name: str, context: dict) -> str:
    template = _jinja_env.get_template(name)
    return template.render(**context)
