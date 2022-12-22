owlout=$(owl version)
if [ $? -ne 0 ]; then echo "expected owl version to succeed before owl init"; exit 1; fi
if [[ "$owlout" != *"version 0.1."* ]]; then echo "expected owl version to start with 0.1"; exit 1; fi

owlout=$(owl --version)
if [ $? -ne 0 ]; then echo "expected owl --version to succeed before owl init"; exit 1; fi
if [[ "$owlout" != *"version 0.1."* ]]; then echo "expected owl version to start with 0.1"; exit 1; fi


owlout=$(owl help)
if [ $? -ne 0 ]; then echo "expected help owl to succeed before init"; exit 1; fi
if [[ "$owlout" != *"Available Commands:"* ]]; then echo "expected owl help to include available commands"; exit 1; fi

owlout=$(owl --help)
if [ $? -ne 0 ]; then echo "expected owl --help to succeed before init"; exit 1; fi
if [[ "$owlout" != *"Available Commands:"* ]]; then echo "expected owl --help to include available commands"; exit 1; fi

owlout=$(owl)
if [ $? -ne 0 ]; then echo "expected owl to succeed before init"; exit 1; fi
if [[ "$owlout" != *"Available Commands:"* ]]; then echo "expected owl to include available commands"; exit 1; fi

