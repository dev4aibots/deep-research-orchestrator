# Deep Research Orchestrator

![Terminal Demo](demo.gif)

An agentic workflow designed for long-horizon planning and deep research tasks.

## Tech Stack
- **Python**
- **Agents** (LangGraph / multi-step orchestration)
- **APIs/JSON** (Web scraping, search APIs)
- **Evaluation** (Output verification)


## Architecture

```mermaid
flowchart TD
    A[Initial Prompt] --> B(Planner Agent)
    B --> C[Task Queue]
    C --> D[Web Search Worker]
    C --> E[Data Extraction Worker]
    D & E --> F(Synthesizer Agent)
    F -->|Review| B
    F --> G[Final Research Report]
```

## Live Endpoint (Interactive Demo)
This project is deployed as a serverless backend on Vercel. You can test the API instantly via your terminal.

```bash
# Example Request

![Terminal Demo](demo.gif)
curl -X GET https://deep-research-orchestrator-106ac3api-dev4aibots.vercel.app/api/health
```

## Demo
To generate a terminal GIF demonstration using `vhs`, run:
```bash
vhs demo.tape
```
