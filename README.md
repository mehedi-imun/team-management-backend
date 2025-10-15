---
title: Backend Documentation
---

# Team Management Backend

## Overview
Backend built with **TypeScript + Node.js + Express + MongoDB**.  
Features:

- CRUD for teams and members  
- Manager & Director approvals  
- Team ordering & bulk operations  
- Request validation using **Zod**  
- Pagination & search  
- Global error handling  

---

## API Endpoints

### Teams
- `GET /api/teams` – List teams (pagination & search)  
- `POST /api/teams` – Create team  
- `GET /api/teams/:id` – Get team  
- `PUT /api/teams/:id` – Update team  
- `DELETE /api/teams/:id` – Delete team  
- `PATCH /api/teams/order` – Update order  
- `DELETE /api/teams/bulk-delete` – Bulk delete  

### Members
- `PATCH /api/teams/:teamId/members/:id` – Update member  
- `DELETE /api/teams/:teamId/members/:id` – Delete member  

### Approval
- `PATCH /api/teams/:id/approval` – Update manager/director approval  

---

## Validation
All requests validated using **Zod** schemas.  

---

## Pagination
Supports `page`, `limit`, `searchTerm`, and `sort`.  

---

## Error Handling
Global middleware returns structured error responses.  
