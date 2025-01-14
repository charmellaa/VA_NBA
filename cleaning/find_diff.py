import pandas as pd

# Load the two CSV files
file1 = pd.read_csv('data/nba_player_stats.csv')
file2 = pd.read_csv('data/NBA_12302024_Traditiona_KAGGLEl.csv')

# Remove the 'Rank' column from file1 as it doesn't exist in file2
file1 = file1.drop(columns=['Rank'])

# Merge the two dataframes on the 'Player' column (i.e., compare based on Player)
merged_df = pd.merge(file1, file2, on='Player', suffixes=('_file1', '_file2'), how='outer', indicator=True)

# Show the rows where the files differ (present in one file but not the other)
differences = merged_df[merged_df['_merge'] != 'both']

# Show differences in the merged data
print("Differences found:")
print(differences)