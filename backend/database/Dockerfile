FROM postgres:16
EXPOSE 5432
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=mypassword
ENV POSTGRES_DB=crypto_info
COPY schema.sql /docker-entrypoint-initdb.d/
