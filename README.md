# Ultrafarma Reserva de Salas - V3

Sistema interno para reserva de salas de reunião e auditório.

## Ajustes desta versão

- Removidas as informações do usuário logado no topo. Agora aparece apenas o botão **Sair**.
- Removido o bloco de métricas da tela principal.
- A aba **Mapa ao vivo** agora é apenas informativa: clicar em uma sala abre os dados da reserva, quem reservou, horário, duração, quantidade de pessoas e observações.
- Removidos botões de reserva e alternância Dia/Semana/Mês dentro do mapa ao vivo.
- A aba **Salas** agora suporta galeria de fotos com scroll horizontal.
- O admin pode editar a galeria de fotos de cada sala informando uma imagem por linha.

## Acesso demo

Admin:
- E-mail: admin@ultrafarma.com
- Senha: admin123

Usuário:
- E-mail: usuario@ultrafarma.com
- Senha: 123456

## Como subir no GitHub/Vercel

Apague os arquivos antigos do repositório e envie todos os arquivos desta pasta para a raiz do GitHub.

A raiz deve ficar assim:

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

Depois faça novo deploy no Vercel. Se estiver vendo versão antiga, use Ctrl + F5 ou abra em janela anônima.

## Observação sobre dados antigos

O sistema usa `localStorage` no modo demonstração. Se o navegador continuar mostrando dados antigos, abra o DevTools > Application > Local Storage e apague a chave `ultraReservaDataV2`.
