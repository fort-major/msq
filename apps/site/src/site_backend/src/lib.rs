static mut STATE: Option<Vec<String>> = Some(Vec::new());

#[ic_cdk::update]
fn store(name: String) -> Vec<String> {
    unsafe {
        STATE.as_mut().unwrap().push(name);

        STATE.as_ref().cloned().unwrap()
    }
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
