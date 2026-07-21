# Ultrafarma Reserva de Salas - V7

Sistema interno para agendamento de salas de reunião e auditório.

## Atualização V7

- Reserva entre datas: agora é possível escolher Data inicial e Data final.
- O sistema bloqueia o mesmo horário em todos os dias do período selecionado.
- Agenda dia, semana, mês, mapa ao vivo e painel admin passam a reconhecer reservas de vários dias.
- Login admin mantido.

## Acesso admin

E-mail: murillo.netto@ultrafarma.com.br  
Senha: admin123

Também existe o admin padrão:

E-mail: admin@ultrafarma.com  
Senha: admin123

## Firebase

O arquivo `firebase-config.js` já está preenchido com os dados do projeto Firebase informado e com:

```js
window.USE_FIREBASE = true;
```

No Firebase, mantenha o Firestore Database ativado e as regras publicadas para teste.

## Estrutura correta para GitHub/Vercel

Suba todos os arquivos extraídos diretamente na raiz do repositório:

```txt
index.html
app.js
styles.css
firebase-config.js
vercel.json
README.md
assets/
logo-ultrafarma.png
logo-u.png
sala-1.jpeg
sala-4.jpeg
sala-5.jpeg
sala-7.jpeg
sala-8.jpeg
mapa-referencia.png
```

## Atualização V8

Esta versão mantém a mesma configuração do Firebase, o mesmo documento de banco e os logins já existentes. Não altera os cadastros/reservas salvos no Firestore.

Inclusões:
- Sala 2 — 4 lugares
- Sala 3 — 4 lugares
- Sala 6 — 8 lugares
- Fotos das novas salas na raiz e em `assets/`
- Logo da Ultrafarma centralizado no topo quando acessado pelo mobile

Para atualizar: substitua os arquivos do GitHub por esta versão. O arquivo `firebase-config.js` já continua apontando para o mesmo Firebase.

Estrutura adicional:
```txt
sala-2.jpeg
sala-3.jpeg
sala-6.jpeg
assets/sala-2.jpeg
assets/sala-3.jpeg
assets/sala-6.jpeg
```
