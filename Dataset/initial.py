import pandas as pd
import os
import seaborn as sns
import matplotlib.pyplot as plt
import scipy.stats as stats
import numpy as np
from scipy.interpolate import interp1d

from tabulate import tabulate
from tti_dataset_tools.TrajectoryTransformer import TrajectoryTransformer
from tti_dataset_tools.TrajectoryVisualizer import TrajectoryVisualizer
from tti_dataset_tools.TrajectoryCleaner import TrajectoryCleaner
from tti_dataset_tools.ColMapper import ColMapper


dataDir= "/home/mushfiqur/vscode/knot-finding/location-2"
sceneId=210
date="2023-05-04"
fps=10
minYDisplacement=5
maxXDisplacement=6
pedDf=pd.read_csv(os.path.join(dataDir,f"{date}-fps-{fps}-scene-{sceneId}-pedestrians.csv"))
otherDf=pd.read_csv(os.path.join(dataDir,f"{date}-fps-{fps}-scene-{sceneId}-others.csv"))
tracksMeta=pd.read_csv(os.path.join(dataDir,f"{date}-fps-{fps}-scene-{sceneId}-meta.csv"))
visualizer=TrajectoryVisualizer()
colMapper= ColMapper(idCol='uniqueTrackId',
                     xCol='sceneX',
                     yCol='sceneY',
                     xVelCol='sceneXVelocity',
                     yVelCol='sceneYVelocity',
                     speedCol='speed',
                     fps=fps
                     )
transformer=TrajectoryTransformer(colMapper)
cleaner=TrajectoryCleaner(colMapper=colMapper,
                          minSpeed=0.0,
                          maxSpeed=3.5,
                          minYDisplacement=minYDisplacement,
                          maxXDisplacement=maxXDisplacement)
transformer.deriveSpeed(pedDf)
transformer.deriveDisplacements(pedDf)

cleanPedDf=cleaner.cleanByYDisplacement(pedDf)

allPedIds=list(cleanPedDf["uniqueTrackId"].unique())
transformer.translateAllToLocalSource(cleanPedDf)

southIds=[]
for pedId in allPedIds:
        trackDf=cleanPedDf[cleanPedDf['uniqueTrackId']==pedId]
        trackMeta=tracksMeta[tracksMeta['uniqueTrackId']==pedId].iloc[0]
        
        if trackMeta['verticalDirection']=="SOUTH":
                southIds.append(pedId)
                X,Y=transformer.rotate180(trackDf,'localX','localY')
                cleanPedDf.loc[cleanPedDf['uniqueTrackId']==pedId,'localX']=X
                cleanPedDf.loc[cleanPedDf['uniqueTrackId']==pedId,'localY']=Y
dataset = cleanPedDf[['sceneId', 'uniqueTrackId', 'localX', 'localY']]

visualizer.show(dataset, idCol='uniqueTrackId', xCol='localX', yCol='localY')

print(f"Dataset shape: {dataset.shape}")
print(dataset.head())


