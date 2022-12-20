SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
TESTS_DIR=$SCRIPT_DIR/tests
echo $SCRIPT_DIR

successes=()
failures=()
skipped=()

for d in $TESTS_DIR/*/ ; do
    dir=$(realpath --relative-to=$TESTS_DIR $d)
    echo "...running $dir"

    volume=$(docker volume create)
    # echo -e "\tcreated docker volume $volume"

    failed=false

    for f in $d* ; do
      file=$(realpath --relative-to=$TESTS_DIR $f)
      if [[ "$failed" = true ]] ; then
        echo "failed. skipping $f"
        skipped+=($file)
        continue
      fi
      # echo -e "\t...running $file"


      # echo -e "\t docker cmd: docker run -v \"$volume:/runs\" nightowl-integration-local:latest \"sh\" \"/tests/$file\""
      output=$(docker run -v "$volume:/runs" --rm --network=nightowl-integration --hostname=local nightowl-integration-local:latest "sh" "-e" "/tests/$file")
      # output=$(docker run --rm nightowl-integration-local:latest "sh" "/tests/$file")
      # docker run -v "$volume:/runs" --rm nightowl-integration-local:latest "sh" "/tests/$file"
      # echo "RESULT: $?"

      if [[ "$?" -eq 0 ]] ; then
        echo -e "\t$file ✓"
        successes+=($file)
      else
        failed=true
        echo -e "\t$file 🞩"
        echo $output
        failures+=($file)
      fi
      # if docker run -v "$volume:/runs" --rm nightowl-integration-local:latest "sh" "/tests/$file" ; then
      #   echo -e "\t$f passed"
      #   successes+=($f)
      # else
      #   failed=true
      #   echo -e "\t$f failed"
      # fi
    done


    #


    docker volume rm $volume > /dev/null
    # echo -e "\tcleaned up docker volume"
done

echo ""

if [ ${#failures[@]} -ne 0 ]; then
  echo "Failures:"
  printf "\t%s\n" "${failures[@]}"
  echo ""
fi

echo "Succeeded: ${#successes[*]}; Failed ${#failures[*]}; Skipped ${#skipped[*]}"
# echo "SUCCESSES: ${successes[*]}"
# echo "FAILED: ${failures[*]}"
# echo "SKIPPED: ${skipped[*]}"

if [ ${#failures[@]} -ne 0 ]; then
  exit 1
fi


# # local -a successes
# # local –a failures
# successes=()

# for d in */ ; do
#     echo "...running $d"

#     failed=false

#     for f in $d* ; do
#       if [[ "$failed" = true ]] ; then
#         echo "failed. skipping $f"
#         continue
#       fi
#       echo -e "\t...running $f"

#       if sh $f ; then
#         echo -e "\t$f passed"
#         successes+=($f)
#       else
#         failed=true
#         echo -e "\t$f failed"
#       fi
#     done
# done

# echo "SUCCESS: $successes"
# echo "FAILURES: $failures"



