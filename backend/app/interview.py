from .llm import get_llm_client, build_interview_system_prompt, build_scoring_prompt
from openai import OpenAI
import json


class InterviewEngine:
    def __init__(self):
        self.client = get_llm_client()

    def start_session(self, case: dict, is_timed: bool = False) -> str:
        system_prompt = build_interview_system_prompt(case, is_timed)
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "I'm ready to begin the case interview. Please present the case."},
            ],
            temperature=0.7,
            max_tokens=800,
        )
        return response.choices[0].message.content

    def continue_conversation(self, messages: list, case: dict, is_timed: bool = False) -> str:
        system_prompt = build_interview_system_prompt(case, is_timed)
        formatted = [{"role": "system", "content": system_prompt}]
        for m in messages:
            formatted.append({"role": m["role"], "content": m["content"]})

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=formatted,
            temperature=0.7,
            max_tokens=800,
        )
        return response.choices[0].message.content

    def score_session(self, messages: list, case: dict) -> dict:
        scoring_prompt = build_scoring_prompt(messages, case)
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": scoring_prompt}],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {
                "scores": {
                    "structure": {"score": 50, "reason": "Could not parse"},
                    "hypothesis": {"score": 50, "reason": "Could not parse"},
                    "quantitative": {"score": 50, "reason": "Could not parse"},
                    "communication": {"score": 50, "reason": "Could not parse"},
                    "insight": {"score": 50, "reason": "Could not parse"},
                },
                "overall": 50,
                "summary": "Scoring could not be completed.",
                "strengths": [],
                "improvements": [],
                "recommendation": "Incomplete",
            }


engine = InterviewEngine()
