from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SaveHistoryRequest(BaseModel):
    total:          int
    count:          int
    impulse_score:  int
    impulse_ratio:  float
    impulse_amount: int
    impulse_count:  int
    cat_ratios:     dict[str, float]
    impulse_items:  list[dict]
    action_guide:   dict
    thresholds:     dict | None = None


class HistoryItem(BaseModel):
    id:             int
    analyzed_at:    datetime
    total:          int
    count:          int
    impulse_score:  int
    impulse_ratio:  float
    impulse_amount: int
    impulse_count:  int
    cat_ratios:     dict[str, float]
    impulse_items:  list[dict]
    action_guide:   dict
    thresholds:     dict | None

    model_config = {"from_attributes": True}


class ChallengeRequest(BaseModel):
    target_score: int


class ChallengeOut(BaseModel):
    id:           int
    started_at:   datetime
    target_score: int
    status:       str

    model_config = {"from_attributes": True}
