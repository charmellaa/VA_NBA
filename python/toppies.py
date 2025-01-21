import pandas as pd

# Load the CSV files
shai = pd.read_csv('data/shai.csv')
giannis = pd.read_csv('data/giannis.csv')
jokic = pd.read_csv('data/jokic.csv')

# Add a 'Player' column to each dataframe
shai['Player'] = 'Shai Gilgeous-Alexander'
giannis['Player'] = 'Giannis Antetokounmpo'
jokic['Player'] = 'Nikola Jokić'

# Merge the dataframes on the 'Season' column to find common seasons
common_seasons = set(shai['Season']).intersection(giannis['Season']).intersection(jokic['Season'])

# Filter each dataframe to include only the common seasons
shai_filtered = shai[shai['Season'].isin(common_seasons)]
giannis_filtered = giannis[giannis['Season'].isin(common_seasons)]
jokic_filtered = jokic[jokic['Season'].isin(common_seasons)]

# Concatenate the filtered dataframes
combined = pd.concat([shai_filtered, giannis_filtered, jokic_filtered])

# Sort by Season and Player for better readability
combined = combined.sort_values(by=['Season', 'Player'])

# Save the result to a CSV file
combined.to_csv('data/top_pies.csv', index=False)
