install:
	pip3 install -r requirements.txt

run:
	python3 app.py
test:
	@if [ -f app.py ]; then \
		echo "app.py exists. Download successful!"; \
		exit 0; \
	else \
		echo "app.py not found. Download failed!"; \
		exit 1; \
	fi
	# do pip3 install --upgrade flask werkzeug if there are any errors related to that when 