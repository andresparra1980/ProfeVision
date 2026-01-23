---
description: Create a new Git worktree for a branch
---
1. Run the following command to create a new worktree in `../worktrees/ProfeVision/<branch_name>`:
```bash
git worktree add ../worktrees/ProfeVision/<branch_name> <branch_name>
```
> [!NOTE]
> If the branch does not exist, use `git worktree add -b <branch_name> ../worktrees/ProfeVision/<branch_name>`
