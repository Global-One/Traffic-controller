FROM python:latest
WORKDIR /usr/src/app

COPY app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY .. .

EXPOSE 80
ENV PYTHONPATH ${PYTHONPATH}:/usr/src/app
CMD [ "python3", "./server/app/app.py" ]
