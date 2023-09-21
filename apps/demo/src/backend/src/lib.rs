#[ic_cdk::update]
fn greet_certified(name: String) -> String {
    ic_cdk::println!("update executed");
    format!("Hello from update, {}!", name)
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    ic_cdk::println!("query executed");
    format!("Hello from query, {}!", name)
}
