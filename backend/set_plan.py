"""AirScope Analytics - Subscription Plan Management Utility

Allows administrators and developers to update user subscription tiers
('free', 'pro', 'enterprise') in SQLite or MySQL databases.
"""

import argparse
import sys
from app.db import SessionLocal
from app.models import User

VALID_PLANS = ["free", "pro", "enterprise"]

def update_user_plan(email: str, plan: str):
    plan_clean = plan.lower().strip()
    if plan_clean not in VALID_PLANS:
        print(f"[ERROR] Invalid plan '{plan}'. Must be one of: {VALID_PLANS}")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip()).first()
        if not user:
            print(f"[ERROR] User with email '{email}' not found in database.")
            users = db.query(User.email, User.plan).all()
            if users:
                print("\nExisting users in database:")
                for u in users:
                    print(f" - {u[0]} (Current plan: {u[1]})")
            sys.exit(1)

        old_plan = user.plan
        user.plan = plan_clean
        db.commit()
        print(f"[SUCCESS] Updated user '{user.email}' from '{old_plan}' to '{plan_clean}' plan.")
        print("\n[IMPORTANT]: The user must LOG OUT and LOG BACK IN on the web frontend")
        print("so that a new cryptographically signed JWT session cookie is minted with the Pro tier.")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Set an AirScope user's subscription plan")
    parser.add_argument("email", help="Account email address (e.g. user@example.com)")
    parser.add_argument("plan", nargs="?", default="pro", choices=VALID_PLANS, help="Plan tier: free, pro, enterprise (default: pro)")
    args = parser.parse_args()
    update_user_plan(args.email, args.plan)
