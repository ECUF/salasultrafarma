# Sistema de Reserva de Salas — Ultrafarma

Sistema/site estático para agendamento de salas de reunião, pronto para subir no GitHub, Vercel e Firebase Firestore.

## Salas cadastradas

- Sala 1 — 4 lugares
- Sala 7 — 4 lugares
- Sala 4 — 8 lugares
- Sala 5 — 8 lugares
- Sala 8 — 4 lugares
- Auditório — 100 lugares

## Como publicar no GitHub/Vercel

1. Faça upload de todos os arquivos desta pasta para um repositório no GitHub.
2. No Vercel, clique em **Add New > Project** e selecione o repositório.
3. Como o site é estático, não precisa de build command.
4. Use como output/root a própria pasta do projeto.

## Como ligar com Firebase

1. Crie um projeto no Firebase.
2. Crie um App Web nas configurações do projeto.
3. Copie o objeto `firebaseConfig`.
4. Abra o arquivo `firebase-config.js` e substitua os campos vazios.
5. No Firestore Database, crie o banco em modo produção ou teste.
6. Publique novamente no Vercel.

Enquanto o Firebase não estiver configurado, o sistema funciona em **modo demonstração**, salvando no `localStorage` do navegador.

## Coleções usadas no Firestore

### `bookings`
Campos:
- `roomId`
- `roomName`
- `date`
- `startTime`
- `endTime`
- `title`
- `requester`
- `email`
- `people`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

### `employees`
Campos:
- `name`
- `email`
- `department`
- `createdAt`

## Regra simples para Firestore em ambiente interno

Use esta regra apenas se o site for restrito ao ambiente interno. Para controle completo por login, o ideal é ativar Firebase Authentication.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{document} {
      allow read, write: if true;
    }
    match /employees/{document} {
      allow read, write: if true;
    }
  }
}
```

## Observações

- O sistema bloqueia conflitos de horário para a mesma sala e mesma data.
- O formulário valida capacidade máxima da sala.
- Reservas canceladas ficam visíveis no histórico do dia.
- A interface já usa logos e fotos das salas enviadas.
