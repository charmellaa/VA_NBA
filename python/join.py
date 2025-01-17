import pandas as pd


df1 = pd.read_csv("data/full_nba_data.csv")

# Load the second dataset (player details)
df2 = pd.read_csv("data/playerslist.csv")

# Merge the datasets on the 'Player' column
df_merged = pd.merge(df1, df2[['Player', 'Height_inches', 'Weight_lbs']], on='Player', how='left')

# Check the resulting dataset
print(df_merged.head())

# Save the merged dataset if needed
df_merged.to_csv("data/full_nba_data_parallel.csv", index=False)
