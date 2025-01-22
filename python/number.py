import pandas as pd

# Load your CSV file
df = pd.read_csv('data/playerslist.csv')

# Remove the '.0' from all values in the 'Number' column
df['Number'] = df['Number'].astype(str).str.replace(r'\.0$', '', regex=True)

# Save the modified DataFrame back to a CSV file
df.to_csv('data/playerslist.csv', index=False)

print("Updated file")
