import pandas as pd


df1 = pd.read_csv("data/full_nba_data.csv")
df2 = pd.read_csv("data/playerslist.csv")

df_merged = pd.merge(df1, df2[['Player', 'Height_inches', 'Weight_lbs']], on='Player', how='left')

print(df_merged.head())
df_merged.to_csv("data/full_nba_data_parallel.csv", index=False)
