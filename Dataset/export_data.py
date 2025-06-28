import pandas as pd
import json
import os
import sys
from tti_dataset_tools.TrajectoryTransformer import TrajectoryTransformer
from tti_dataset_tools.TrajectoryCleaner import TrajectoryCleaner
from tti_dataset_tools.ColMapper import ColMapper

def process_and_export_data():
    """Process trajectory data and export it as JSON for Java consumption"""
    
    # Configuration
    dataDir = "/root/location-2"
    sceneId = 210
    date = "2023-05-04"
    fps = 10
    minYDisplacement = 5
    maxXDisplacement = 6
    
    try:
        # Load data
        pedDf = pd.read_csv(os.path.join(dataDir, f"{date}-fps-{fps}-scene-{sceneId}-pedestrians.csv"))
        otherDf = pd.read_csv(os.path.join(dataDir, f"{date}-fps-{fps}-scene-{sceneId}-others.csv"))
        tracksMeta = pd.read_csv(os.path.join(dataDir, f"{date}-fps-{fps}-scene-{sceneId}-meta.csv"))
        
        # Initialize tools
        colMapper = ColMapper(
            idCol='uniqueTrackId',
            xCol='sceneX',
            yCol='sceneY',
            xVelCol='sceneXVelocity',
            yVelCol='sceneYVelocity',
            speedCol='speed',
            fps=fps
        )
        
        transformer = TrajectoryTransformer(colMapper)
        cleaner = TrajectoryCleaner(
            colMapper=colMapper,
            minSpeed=0.0,
            maxSpeed=3.5,
            minYDisplacement=minYDisplacement,
            maxXDisplacement=maxXDisplacement
        )
        
        # Process data
        transformer.deriveSpeed(pedDf)
        transformer.deriveDisplacements(pedDf)
        cleanPedDf = cleaner.cleanByYDisplacement(pedDf)
        
        allPedIds = list(cleanPedDf["uniqueTrackId"].unique())
        transformer.translateAllToLocalSource(cleanPedDf)
        
        # Handle south-bound pedestrians
        southIds = []
        for pedId in allPedIds:
            trackDf = cleanPedDf[cleanPedDf['uniqueTrackId'] == pedId]
            trackMeta = tracksMeta[tracksMeta['uniqueTrackId'] == pedId].iloc[0]
            
            if trackMeta['verticalDirection'] == "SOUTH":
                southIds.append(pedId)
                X, Y = transformer.rotate180(trackDf, 'localX', 'localY')
                cleanPedDf.loc[cleanPedDf['uniqueTrackId'] == pedId, 'localX'] = X
                cleanPedDf.loc[cleanPedDf['uniqueTrackId'] == pedId, 'localY'] = Y
        
        # Create final dataset
        dataset = cleanPedDf[['sceneId', 'uniqueTrackId', 'localX', 'localY']]
        
        # Convert to JSON format suitable for Java
        trajectory_data = []
        for _, row in dataset.iterrows():
            trajectory_data.append({
                'sceneId': int(row['sceneId']),
                'uniqueTrackId': int(row['uniqueTrackId']),
                'localX': float(row['localX']),
                'localY': float(row['localY'])
            })
        
        # Export to JSON file
        output_file = os.path.join(os.path.dirname(__file__), 'trajectory_data.json')
        with open(output_file, 'w') as f:
            json.dump(trajectory_data, f, indent=2)
        
        print(f"Successfully exported {len(trajectory_data)} trajectory records to {output_file}")
        print(f"Dataset shape: {dataset.shape}")
        print(f"Unique tracks: {len(dataset['uniqueTrackId'].unique())}")
        
        return True
        
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return False

if __name__ == "__main__":
    success = process_and_export_data()
    sys.exit(0 if success else 1)
