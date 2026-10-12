# Backend patch (3 small edits)

1. Copy `app/extras.py` next to your `main.py`.

2. `app/config.py`, inside `class Settings`:
```python
    # "nodes": the frontend node graph decides orders (Chandelier node -> Delay -> AutoTrader).
    # "backend": legacy - backend executes its own Chandelier signal when AUTO is armed.
    signal_source: str = "nodes"
```

3. `app/main.py`
```python
from .extras import build_router            # with the other imports
...
app = FastAPI(title="Step Index Terminal", lifespan=lifespan)
app.include_router(build_router(application))   # right after app = FastAPI(...)
...
# in App.on_signal(), right after the broadcast("signal", ...) and BEFORE `if self.risk.mode is not Mode.auto`:
        if settings.signal_source == "nodes":
            return
```
Why: without edit 3 the backend would ALSO trade its own signal and you would get double orders
(the idempotency key would drop one, but the node graph's SL/TP/delay settings would not apply).

Bugs noticed in the files you sent (not fixed here):
* brokers/deriv.py uses `settings` without importing it and reads `self.account["loginid"/"scopes"]` that are never set.
* doctor.py prints `settings.deriv_ws_url`, which does not exist (use `settings.ws_url`).
