# Ultrafarma Reserva de Salas - V9

Correção do erro em que o site abre mostrando o conteúdo do `firebase-config.js`.

## Importante
O arquivo `index.html` precisa começar com:

```html
<!doctype html>
<html lang="pt-BR">
```

O arquivo `firebase-config.js` fica separado e não deve ser colado dentro do `index.html`.

## Firebase
Esta versão mantém `window.USE_FIREBASE = true` e usa o mesmo projeto Firebase já configurado.
Não apague o banco Firestore e não altere usuários/reservas cadastrados.

## Login admin mantido
- murillo.netto@ultrafarma.com.br / admin123
- admin@ultrafarma.com / admin123

## Atualização no GitHub
1. Apague os arquivos atuais do repositório.
2. Suba todos os arquivos desta pasta para a raiz do repositório.
3. Confirme que existem arquivos separados: `index.html`, `app.js`, `styles.css`, `firebase-config.js`.
4. No Vercel, faça Redeploy.
