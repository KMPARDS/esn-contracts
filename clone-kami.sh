#!/bin/bash
if [ -d "../kami" ] 
then
    echo "Kami project already exists." 
else
    echo "Kami project does not exists, cloning it..."
    cd ..
    git clone https://github.com/KMPARDS/kami.git
    echo "Kami project cloned"
fi