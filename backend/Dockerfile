FROM golang:1.24.1-alpine

RUN apk add --no-cache gcc musl-dev sqlite

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN mkdir -p /app/data

RUN CGO_ENABLED=1 go build -o main .

EXPOSE 8080

CMD ["./main"]