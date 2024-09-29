install:
	pip3 install -r requirements.txt

run:
	python3 app.py
test:
	python3 -m pytest
	# do pip3 install --upgrade flask werkzeug if there are any errors related to that when 