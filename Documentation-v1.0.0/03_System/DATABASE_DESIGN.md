# DATABASE_DESIGN

## Collections
- users
- workspaces
- projects
- workflow_steps
- business_context
- ai_outputs
- exports
- audit_logs

## Relasi
User -> Workspace -> Project -> Workflow -> AI Output

## Aturan
- Semua dokumen memiliki owner_id.
- Soft delete untuk project.
- Timestamp: created_at, updated_at.
