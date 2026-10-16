#!/bin/bash
API=http://localhost:4000/api
PASS=0; FAIL=0

check() { # name expected actual
  if [ "$2" == "$3" ]; then echo "PASS  $1 ($3)"; PASS=$((PASS+1));
  else echo "FAIL  $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
}
json() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log($1)})"; }
login() { curl -s -o /dev/null -c "jar_$1.txt" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1@xperts.test\",\"password\":\"Password@123\"}" $API/auth/login; }
act() { # user id action [json body] -> http code
  curl -s -o /dev/null -w "%{http_code}" -b "jar_$1.txt" -X POST \
    -H "Content-Type: application/json" -d "${4:-{\}}" "$API/requests/$2/$3"; }
create() { # approverId -> request id
  curl -s -b jar_sara.txt -F type=EXPENSE -F currency=PKR -F amount=2500.50 -F notes="Test taxi" \
    -F selectedApproverId=$1 -F file=@receipt.pdf $API/requests | json "j.data.id"; }
status() { curl -s -b "jar_$1.txt" $API/requests/$2 | json "j.data.status"; }

printf '%%PDF-1.4\n%%test\n%%%%EOF\n' > receipt.pdf
for u in sara asif muhammad ali accounting; do login $u; done

ASIF=$(curl -s -b jar_sara.txt $API/users/approvers | json "j.data.find(u=>u.email==='asif@xperts.test').id")
R1=$(create $ASIF); R2=$(create $ASIF)
echo "R1=$R1"; echo "R2=$R2"; echo "-----"

check "new request is PENDING" PENDING "$(status sara $R1)"
check "sara forwards own request -> 403" 403 "$(act sara $R1 forward)"
check "accounting (not selected) forwards -> 403" 403 "$(act accounting $R1 forward)"
check "asif start-review -> 200" 200 "$(act asif $R1 start-review)"
check "status UNDER_REVIEW" UNDER_REVIEW "$(status asif $R1)"
check "asif approve -> 403" 403 "$(act asif $R1 approve)"
check "asif forward -> 200" 200 "$(act asif $R1 forward '{"comment":"Looks fine"}')"
check "status AWAITING_FINAL_APPROVAL" AWAITING_FINAL_APPROVAL "$(status muhammad $R1)"
check "muhammad reject without comment -> 400" 400 "$(act muhammad $R1 reject)"
check "muhammad reject blank comment -> 400" 400 "$(act muhammad $R1 reject '{"comment":"   "}')"
check "muhammad approve -> 200" 200 "$(act muhammad $R1 approve)"
check "status APPROVED" APPROVED "$(status muhammad $R1)"
check "second approve -> 409" 409 "$(act muhammad $R1 approve)"
check "ali reads sara's request -> 403" 403 "$(curl -s -o /dev/null -w '%{http_code}' -b jar_ali.txt $API/requests/$R1)"
HIST=$(curl -s -b jar_muhammad.txt $API/requests/$R1/history | json "j.data.map(h=>h.action).join(',')")
check "history order" "SUBMITTED,REVIEW_STARTED,FORWARDED,APPROVED" "$HIST"

echo "--- request 2 (reject path) ---"
check "muhammad reject on PENDING -> 403" 403 "$(act muhammad $R2 reject '{"comment":"no"}')"
check "asif reject without comment -> 400" 400 "$(act asif $R2 reject)"
check "asif reject with comment -> 200" 200 "$(act asif $R2 reject '{"comment":"Missing invoice"}')"
check "status REJECTED" REJECTED "$(status sara $R2)"
check "forward after reject -> 409" 409 "$(act asif $R2 forward)"
check "sara sees availableActions empty" "0" "$(curl -s -b jar_sara.txt $API/requests/$R2 | json 'j.data.availableActions.length')"
check "asif sees actions on R1? (APPROVED -> none)" "0" "$(curl -s -b jar_asif.txt $API/requests/$R1 | json 'j.data.availableActions.length')"

echo "-----"; echo "Passed: $PASS  Failed: $FAIL"
rm -f receipt.pdf jar_*.txt
