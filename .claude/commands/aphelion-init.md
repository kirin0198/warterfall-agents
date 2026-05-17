Launch the Rules Designer agent for first-run project setup.

Run immediately after `npx aphelion-agents init`. This is a required step —
all subsequent agents read `.claude/rules/project-rules.md` for project context
(language / framework, Git conventions, build commands, output language,
Co-Authored-By policy). Skipping this step causes agents to fall back to
defaults, which may not match your project.

If `.claude/rules/project-rules.md` already exists, the agent will detect it and
ask whether to amend or recreate. INTERVIEW_RESULT.md is optional; running this
command standalone (without prior Discovery artifacts) is supported.

User requirements:
$ARGUMENTS
