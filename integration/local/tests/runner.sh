TESTS_DIR=/tests

successes=()
failures=()
skipped=()


if [ ! -f /.dockerenv ]; then
  echo "NOT RUNNING IN DOCKER. REFUSING TO RUN."
  exit 1;
fi

if [ ! -d /example ]; then
  echo "NO /example DIRECTORY. REFUSING TO RUN."
  exit 1;
fi

for d in $TESTS_DIR/*/ ; do
    dir=$(python -c "import os.path; print(os.path.relpath('$d', '$TESTS_DIR'))")
    echo "...running $dir"

    mkdir -p /example/run-$dir
    cd /example/run-$dir

    failed=false

    for f in $d* ; do
      file=$(python -c "import os.path; print(os.path.relpath('$f', '$TESTS_DIR'))")
      if [[ "$failed" = true ]] ; then
        echo "failed. skipping $f"
        skipped+=($file)
        continue
      fi
      output=$(sh -e "$TESTS_DIR/$file")

      if [[ "$?" -eq 0 ]] ; then
        echo -e "\t$file ✓"
        successes+=($file)
      else
        failed=true
        echo -e "\t$file 🞩"
        echo $output
        failures+=($file)
      fi
    done

    cd /example
    rm -rf /example/run-$dir
done

echo ""

if [ ${#failures[@]} -ne 0 ]; then
  echo "Failures:"
  printf "\t%s\n" "${failures[@]}"
  echo ""
fi

echo "Succeeded: ${#successes[*]}; Failed ${#failures[*]}; Skipped ${#skipped[*]}"

if [ ${#failures[@]} -ne 0 ]; then
  exit 1
fi