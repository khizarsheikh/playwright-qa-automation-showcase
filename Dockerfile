FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node app/ ./app/
USER node
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=5 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "app/server.mjs"]
