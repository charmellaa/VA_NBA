import pandas as pd

df = pd.read_csv('data/playerslist.csv')
df['Number'] = df['Number'].astype(str).str.replace(r'\.0$', '', regex=True)
df.to_csv('data/playerslist.csv', index=False)
print("Updated file")
