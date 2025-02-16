# setup.py

from setuptools import setup, find_packages
import pathlib

# The directory containing this file
HERE = pathlib.Path(__file__).parent

# The text of the README file
README = (HERE / "README.md").read_text()
VERSION = (HERE / "VERSION").read_text().strip()

setup(
    name='signaling_service',
    version=VERSION,
    description='A Python package for facilitating WebRTC connections.',
    long_description=README,
    long_description_content_type="text/markdown",
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    python_requires='>=3.12, <4',
    install_requires=[
        'requests',
        'boto3',
    ],
    extras_require={
        'test': [
            'pytest>=7.4.3',
        ]
    }
)