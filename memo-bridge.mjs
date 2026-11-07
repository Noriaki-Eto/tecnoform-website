export function requestMemo(text, dispatch){
 const request={text,saved:false};dispatch(request);return request.saved===true;
}
