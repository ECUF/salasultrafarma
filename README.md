# Ultrafarma Reserva de Salas - V2

Sistema interno para agendamento de salas de reunião e auditório.

## O que foi ajustado

- As fotos e o logo agora estão dentro da pasta `assets/` e referenciados com caminhos relativos corretos para funcionar no GitHub/Vercel.
- Tela de login restrita.
- Solicitação de cadastro com aprovação pelo administrador.
- Painel admin para gerenciar pessoas, reservas, salas/espaços e regras de horário.
- Visualização da agenda por dia, semana e mês.
- Filtro por sala.
- Mapa ao vivo com status por horário: disponível, próxima reserva e ocupada.
- Modo demonstração com `localStorage`.
- Arquivo `firebase-config.js` preparado para conexão posterior com Firebase.

## Acessos de demonstração

Administrador:
- E-mail: `admin@ultrafarma.com`
- Senha: `admin123`

Usuário aprovado:
- E-mail: `usuario@ultrafarma.com`
- Senha: `123456`

## Como subir no GitHub/Vercel

Suba os arquivos da pasta para a raiz do repositório:

```txt
index.html
app.js
styles.css
firebase-config.js
vercel.json
README.md
assets/
```

Não suba a pasta inteira dentro de outra pasta. O `index.html` precisa ficar na raiz do repositório.

## Firebase

Por padrão, o sistema roda em modo demonstração. Para usar Firebase de verdade, será necessário ligar o Firebase Authentication e Firestore, preencher o arquivo `firebase-config.js` e adaptar as regras do Firestore.

Recomendação de coleções:

```txt
users
rooms
reservations
settings
```

Regras básicas recomendadas:
- Apenas usuários autenticados podem ler salas e reservas.
- Apenas admins podem aprovar usuários, editar salas e alterar regras.
- Usuários aprovados podem criar reservas.
