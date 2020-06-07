#!/bin/bash
if [ -d "./kami" ] 
then
    echo "Kami project already exists." 
else
    echo "Kami project does not exists, cloning it..."
    git clone https://github.com/KMPARDS/kami.git
    echo "Kami project cloned"
    rm ./kami/src/types/global.d.ts
    echo "Removed ./kami/src/types/global.d.ts"
    rm ./kami/test/global.ts
    echo "Removed ./kami/test/global.ts"
fi