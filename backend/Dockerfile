FROM golang:1.24.1-alpine

# Устанавливаем необходимые пакеты для CGO и SQLite
RUN apk add --no-cache gcc musl-dev sqlite

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

# Создаем директорию для данных
RUN mkdir -p /app/data

# Компилируем с включенным CGO
RUN CGO_ENABLED=1 go build -o main .

EXPOSE 8080

CMD ["./main"]