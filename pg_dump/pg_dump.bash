python - <<'PY'
import glob, os
import pandas as pd

files = sorted(glob.glob("export_csv/*.csv"))
out = "db_export.xlsx"

with pd.ExcelWriter(out, engine="openpyxl") as writer:
    for f in files:
        sheet = os.path.splitext(os.path.basename(f))[0][:31]
        df = pd.read_csv(f)
        df.to_excel(writer, sheet_name=sheet, index=False)

print("written:", out)
PY
