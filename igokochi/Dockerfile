FROM node:23-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- runtime stage ---
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY nginx/entrypoint.sh /entrypoint.sh
RUN sed -i '1s/^\xEF\xBB\xBF//' /entrypoint.sh \
 && sed -i 's/\r$//' /entrypoint.sh \
 && chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]